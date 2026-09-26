import { User } from "../models/user.model.js";
import {
  CONNECTION_STATUS,
  Connection,
  CONNECTABLE_ROLES,
  counterpartRole,
  pairKey,
} from "../models/connection.model.js";
import { ApiError } from "../utils/api-error.js";
import { publicUser } from "../utils/user.js";
import { dbReady } from "../config/db.js";

const assertConnectable = (user) => {
  if (!CONNECTABLE_ROLES.includes(user.role)) {
    throw new ApiError(
      403,
      `Only ${CONNECTABLE_ROLES.join(" and ")} accounts can use the network`,
    );
  }
};

const withCounters = async (userId) => {
  const [received, sent, connected] = await Promise.all([
    Connection.countDocuments({
      to: userId,
      status: CONNECTION_STATUS.PENDING,
    }),
    Connection.countDocuments({
      from: userId,
      status: CONNECTION_STATUS.PENDING,
    }),
    Connection.countDocuments({
      status: CONNECTION_STATUS.ACCEPTED,
      $or: [{ from: userId }, { to: userId }],
    }),
  ]);

  return { received, sent, connected };
};

const idOf = (ref) =>
  (ref && typeof ref === "object" && ref._id ? ref._id : ref).toString();

/**
 * Both refs may be populated documents or bare ObjectIds depending on where the
 * connection came from, so the id is always read through idOf. Comparing a
 * populated document with a string silently fails, which is what made
 * `counterpart` null and the direction inverted.
 */
const shape = (connection, viewerId) => {
  const iAmSender = idOf(connection.from) === viewerId;
  const other = iAmSender ? connection.to : connection.from;
  const isPopulated = Boolean(other && typeof other === "object" && other.name);

  return {
    id: connection._id.toString(),
    status: connection.status,
    direction: iAmSender ? "sent" : "received",
    counterpartId: idOf(other),
    counterpart: isPopulated
      ? { id: idOf(other), name: other.name, role: other.role }
      : null,
    createdAt: connection.createdAt,
    respondedAt: connection.respondedAt,
  };
};

export const sendConnection = async (req, res, next) => {
  try {
    assertConnectable(req.user);

    if (!dbReady()) {
      throw new ApiError(503, "Database unavailable, try again shortly");
    }

    const target = await User.findById(req.body.toUserId).select("role");

    if (!target) throw new ApiError(404, "No such user");
    if (target._id.equals(req.user._id)) {
      throw new ApiError(400, "You cannot connect with yourself");
    }
    if (target.role !== counterpartRole(req.user.role)) {
      throw new ApiError(
        400,
        `A ${req.user.role} can only connect with a ${counterpartRole(req.user.role)}`,
      );
    }

    const key = pairKey(req.user._id, target._id);
    const existing = await Connection.findOne({ pairKey: key });

    if (existing?.status === CONNECTION_STATUS.ACCEPTED) {
      throw new ApiError(409, "You are already connected");
    }
    if (existing?.status === CONNECTION_STATUS.PENDING) {
      const direction =
        existing.from.toString() === req.user._id.toString()
          ? "They already have a request from you waiting"
          : "They already sent you a request";
      throw new ApiError(409, direction);
    }

    // A previous rejection or cancellation is replaced rather than duplicated,
    // because pairKey is unique for the two of them.
    const connection = existing
      ? await Connection.findOneAndUpdate(
          { pairKey: key },
          {
            from: req.user._id,
            to: target._id,
            status: CONNECTION_STATUS.PENDING,
            respondedAt: null,
          },
          { new: true },
        )
      : await Connection.create({
          from: req.user._id,
          to: target._id,
          pairKey: key,
          status: CONNECTION_STATUS.PENDING,
        });

    const populated = await connection.populate([
      { path: "from", select: "name email role" },
      { path: "to", select: "name email role" },
    ]);

    res
      .status(201)
      .json({ connection: shape(populated, req.user._id.toString()) });
  } catch (err) {
    next(err);
  }
};

export const respondConnection = async (req, res, next) => {
  try {
    assertConnectable(req.user);

    const connection = await Connection.findById(req.params.id);
    if (!connection) throw new ApiError(404, "Request not found");

    if (!connection.to.equals(req.user._id)) {
      throw new ApiError(403, "You can only respond to requests sent to you");
    }
    if (connection.status !== CONNECTION_STATUS.PENDING) {
      throw new ApiError(409, `This request was already ${connection.status}`);
    }

    connection.status =
      req.body.action === "accept"
        ? CONNECTION_STATUS.ACCEPTED
        : CONNECTION_STATUS.REJECTED;
    connection.respondedAt = new Date();
    await connection.save();

    const populated = await connection.populate([
      { path: "from", select: "name email role" },
      { path: "to", select: "name email role" },
    ]);

    res.json({ connection: shape(populated, req.user._id.toString()) });
  } catch (err) {
    next(err);
  }
};

export const cancelConnection = async (req, res, next) => {
  try {
    assertConnectable(req.user);

    const connection = await Connection.findById(req.params.id);
    if (!connection) throw new ApiError(404, "Request not found");

    if (!connection.from.equals(req.user._id)) {
      throw new ApiError(403, "You can only cancel requests you sent");
    }
    if (connection.status !== CONNECTION_STATUS.PENDING) {
      throw new ApiError(409, `This request was already ${connection.status}`);
    }

    connection.status = CONNECTION_STATUS.CANCELLED;
    connection.respondedAt = new Date();
    await connection.save();

    const populated = await connection.populate([
      { path: "from", select: "name email role" },
      { path: "to", select: "name email role" },
    ]);

    res.json({ connection: shape(populated, req.user._id.toString()) });
  } catch (err) {
    next(err);
  }
};

const VIEWS = {
  received: (userId) => ({ to: userId, status: CONNECTION_STATUS.PENDING }),
  sent: (userId) => ({ from: userId, status: CONNECTION_STATUS.PENDING }),
  connected: (userId) => ({
    status: CONNECTION_STATUS.ACCEPTED,
    $or: [{ from: userId }, { to: userId }],
  }),
};

export const listConnections = async (req, res, next) => {
  try {
    assertConnectable(req.user);

    const { view, page, limit } = req.validated;
    const filter = VIEWS[view](req.user._id);

    const [rows, total] = await Promise.all([
      Connection.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Connection.countDocuments(filter),
    ]);

    const populated = await Promise.all(
      rows.map((c) =>
        c.populate([
          { path: "from", select: "name email role" },
          { path: "to", select: "name email role" },
        ]),
      ),
    );

    const viewer = req.user._id.toString();

    res.json({
      view,
      connections: populated.map((c) => shape(c, viewer)),
      counters: await withCounters(req.user._id),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * The admin list endpoints are permission gated, so a shipper or carrier has no
 * way to find someone to invite. This is the browse surface for the network:
 * the opposite role only, never yourself, and never an email address.
 */
export const searchDirectory = async (req, res, next) => {
  try {
    assertConnectable(req.user);

    const wanted = counterpartRole(req.user.role);
    const { search, page, limit } = req.validated;

    const filter = { role: wanted, _id: { $ne: req.user._id } };
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: safe, $options: "i" };
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    // One query for every status between this viewer and the page of results,
    // rather than one per row.
    const ids = users.map((u) => u._id);
    const mine = await Connection.find({
      $or: [
        { from: req.user._id, to: { $in: ids } },
        { to: req.user._id, from: { $in: ids } },
      ],
    });

    const stateFor = (userId) => {
      const doc = mine.find(
        (c) => c.from.toString() === userId || c.to.toString() === userId,
      );
      if (!doc) return null;
      const iAmSender = doc.from.toString() === req.user._id.toString();
      return {
        connectionId: doc._id.toString(),
        status: doc.status,
        direction: iAmSender ? "sent" : "received",
      };
    };

    res.json({
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        role: u.role,
        ...(stateFor(u._id.toString()) ?? {}),
      })),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

export { withCounters, publicUser };
