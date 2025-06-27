"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/events.ts
const express_1 = require("express");
const zod_1 = require("zod");
const eventsStore_1 = require("../data/eventsStore");
const validateBody_1 = require("../middleware/validateBody");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST/PUT body schema
const EventSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    date: zod_1.z
        .string()
        .refine((d) => !isNaN(Date.parse(d)), { message: "Invalid date format" }),
    location: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    image: zod_1.z.string().optional().or(zod_1.z.literal("")), // Allow empty string or valid string
    volunteerPositions: zod_1.z.array(zod_1.z.string()).optional(),
});
const EventUpdateSchema = EventSchema.partial()
    .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field must be provided",
});
/** GET  /events       → list all */
router.get("/", async (_req, res, next) => {
    try {
        const all = await (0, eventsStore_1.getEvents)();
        res.json(all);
    }
    catch (e) {
        next(e);
    }
});
/** GET  /events/my    → get current user's events */
router.get("/my", auth_1.requireAuth, async (req, res, next) => {
    try {
        const userEvents = await (0, eventsStore_1.getEventsByUserId)(req.user.id);
        res.json(userEvents);
    }
    catch (e) {
        next(e);
    }
});
/** GET  /events/:id   → one by id */
router.get("/:id", async (req, res, next) => {
    try {
        const ev = await (0, eventsStore_1.getEventById)(req.params.id);
        if (!ev)
            return res.status(404).json({ error: "Event not found" });
        res.json(ev);
    }
    catch (e) {
        next(e);
    }
});
/** POST /events       → create */
router.post("/", auth_1.requireAuth, (0, validateBody_1.validateBody)(EventSchema), async (req, res, next) => {
    try {
        const created = await (0, eventsStore_1.createEvent)(req.body, req.user.id);
        res.status(201).json(created);
    }
    catch (e) {
        next(e);
    }
});
/** PATCH /events/:id  → update */
router.patch("/:id", auth_1.requireAuth, (0, validateBody_1.validateBody)(EventUpdateSchema), async (req, res, next) => {
    try {
        // Check if user owns the event
        const isOwner = await (0, eventsStore_1.checkEventOwnership)(req.params.id, req.user.id);
        if (!isOwner) {
            return res.status(403).json({ error: "You can only update your own events" });
        }
        const updated = await (0, eventsStore_1.updateEventById)(req.params.id, req.body);
        if (!updated)
            return res.status(404).json({ error: "Event not found" });
        res.json(updated);
    }
    catch (e) {
        next(e);
    }
});
/** DELETE /events/:id → remove */
router.delete("/:id", auth_1.requireAuth, async (req, res, next) => {
    try {
        // Check if user owns the event
        const isOwner = await (0, eventsStore_1.checkEventOwnership)(req.params.id, req.user.id);
        if (!isOwner) {
            return res.status(403).json({ error: "You can only delete your own events" });
        }
        const deleted = await (0, eventsStore_1.deleteEventById)(req.params.id);
        if (!deleted)
            return res.status(404).json({ error: "Event not found" });
        res.json(deleted);
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
