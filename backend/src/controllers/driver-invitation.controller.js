import bcrypt from "bcryptjs";
import { config } from "../config/index.js";
import { User } from "../models/user.model.js";
import { DriverProfile } from "../models/profile.model.js";
import {
  DriverInvitation,
  INVITE_STATUS,
  isExpired,
  newInviteToken,
} from "../models/driver-invitation.model.js";
import { buildDriverInvitation, sendEmail } from "../services/mailer.js";
import { ApiError } from "../utils/api-error.js";
import { publicUser } from "../utils/user.js";

const assertCarrier = (user) => {
  if (user.role !== "carrier") {
    throw new ApiError(403, "Only a carrier can manage its drivers");
  }
};

const shape = (invitation, { includeToken = false } = {}) => ({
  id: invitation._id.toString(),
  email: invitation.email,
  status: isExpired(invitation) ? "expired" : invitation.status,
  expiresAt: invitation.expiresAt,
  activatedAt: invitation.activatedAt,
  createdAt: invitation.createdAt,
  driver: invitation.driver
    ? {
        id: invitation.driver._id.toString(),
        name: invitation.driver.name,
        email: invitation.driver.email,
        role: invitation.driver.role,
        isActive: invitation.driver.isActive,
      }
    : null,
  ...(includeToken && { token: invitation.token }),
});

const populateDriver = (q) => q.populate("driver", "name email role isActive");

export const inviteDriver = async (req, res, next) => {
  try {
    assertCarrier(req.user);

    const { name, email, password, firstName, lastName, profileImage } =
      req.body;
    const mail = String(email).trim().toLowerCase();

    const existingUser = await User.findOne({ email: mail });
    if (existingUser && existingUser.role !== "driver") {
      throw new ApiError(409, "That email already belongs to another role");
    }

    const live = await DriverInvitation.findOne({
      carrier: req.user._id,
      email: mail,
      status: { $in: [INVITE_STATUS.PENDING, INVITE_STATUS.ACTIVATED] },
    });
    if (live) {
      throw new ApiError(409, "You have already invited this driver");
    }

    // The driver account exists immediately so the emailed credentials work on
    // first sign-in. Until they sign in or activate, the invitation reads as
    // pending, which is what the carrier sees as "invited".
    const hashed = await bcrypt.hash(password, config.bcryptRounds);
    const driver =
      existingUser ||
      (await User.create({
        name: String(name).trim(),
        email: mail,
        password: hashed,
        role: "driver",
      }));

    const parts = String(name).trim().split(/\s+/);
    await DriverProfile.findOneAndUpdate(
      { user: driver._id },
      {
        user: driver._id,
        firstName: firstName || parts[0],
        lastName: lastName || parts.slice(1).join(" ") || "-",
        profileImage: profileImage || "",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // token is select:false, so it has to be asked for explicitly or the
    // activation link goes out with "undefined" in it.
    const invitation = await DriverInvitation.findOneAndUpdate(
      { carrier: req.user._id, email: mail },
      {
        carrier: req.user._id,
        driver: driver._id,
        email: mail,
        token: newInviteToken(),
        status: INVITE_STATUS.PENDING,
        expiresAt: new Date(
          Date.now() + config.inviteExpiresInDays * 24 * 60 * 60 * 1000,
        ),
        activatedAt: null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).select("+token");

    const carrier = await User.findById(req.user._id).select("name");
    const message = buildDriverInvitation({
      driverName: String(name).trim(),
      carrierName: carrier.name,
      email: mail,
      password,
      activateUrl: `${config.appUrl}/activate?token=${invitation.token}`,
    });

    const delivery = await sendEmail({ to: mail, ...message });

    const populated = await populateDriver(
      DriverInvitation.findById(invitation._id),
    );

    res.status(201).json({
      invitation: shape(populated),
      email: {
        to: mail,
        subject: message.subject,
        delivered: delivery.delivered,
        transport: delivery.transport,
        ...(delivery.file && { writtenTo: delivery.file }),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const listInvitedDrivers = async (req, res, next) => {
  try {
    assertCarrier(req.user);

    const { status } = req.validated;
    const filter = { carrier: req.user._id };
    if (status && status !== "all") filter.status = status;

    const rows = await populateDriver(
      DriverInvitation.find(filter).sort({ createdAt: -1 }),
    );

    const profiles = await DriverProfile.find({
      user: { $in: rows.map((r) => r.driver._id) },
    });
    const byUser = new Map(profiles.map((p) => [p.user.toString(), p]));

    res.json({
      invitations: rows.map((invitation) => ({
        ...shape(invitation),
        profile: byUser.get(invitation.driver._id.toString()) ?? null,
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const invitedDriverDetails = async (req, res, next) => {
  try {
    assertCarrier(req.user);

    const invitation = await populateDriver(
      DriverInvitation.findOne({
        _id: req.params.id,
        carrier: req.user._id,
      }),
    );
    if (!invitation) throw new ApiError(404, "Invitation not found");

    const profile = await DriverProfile.findOne({
      user: invitation.driver._id,
    });

    res.json({
      invitation: shape(invitation),
      profile,
      user: publicUser(invitation.driver),
    });
  } catch (err) {
    next(err);
  }
};

export const revokeInvitation = async (req, res, next) => {
  try {
    assertCarrier(req.user);

    const invitation = await DriverInvitation.findOne({
      _id: req.params.id,
      carrier: req.user._id,
    });
    if (!invitation) throw new ApiError(404, "Invitation not found");
    if (invitation.status === INVITE_STATUS.REVOKED) {
      throw new ApiError(409, "This invitation was already revoked");
    }

    invitation.status = INVITE_STATUS.REVOKED;
    await invitation.save();

    res.json({ invitation: shape(invitation) });
  } catch (err) {
    next(err);
  }
};

/**
 * Lets the driver replace the carrier-chosen password with their own, using
 * the token from the invitation email. The emailed credentials keep working.
 */
export const activateDriver = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const invitation = await DriverInvitation.findOne({ token }).select(
      "+token",
    );
    if (!invitation)
      throw new ApiError(400, "This invitation link is not valid");
    if (invitation.status === INVITE_STATUS.REVOKED) {
      throw new ApiError(400, "This invitation was withdrawn by the carrier");
    }
    if (isExpired(invitation)) {
      throw new ApiError(400, "This invitation has expired, ask for a new one");
    }

    const driver = await User.findById(invitation.driver).select("+password");
    driver.password = await bcrypt.hash(password, config.bcryptRounds);
    await driver.save();

    invitation.status = INVITE_STATUS.ACTIVATED;
    invitation.activatedAt = new Date();
    // The token is spent, so the link cannot be reused.
    invitation.token = newInviteToken();
    await invitation.save();

    res.json({ user: publicUser(driver), activated: true });
  } catch (err) {
    next(err);
  }
};

/**
 * A first successful sign-in is what turns an invitation from pending to
 * activated, so a carrier can tell invited drivers from registered ones without
 * the driver doing anything extra.
 */
export const markActivatedOnLogin = async (user) => {
  if (user.role !== "driver") return;

  const invitation = await DriverInvitation.findOne({
    driver: user._id,
    status: INVITE_STATUS.PENDING,
  });

  if (invitation && !isExpired(invitation)) {
    invitation.status = INVITE_STATUS.ACTIVATED;
    invitation.activatedAt = new Date();
    await invitation.save();
  }
};
