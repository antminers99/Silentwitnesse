import { Router } from "express";

const router = Router();

// Admin review dashboard removed in v0.1.
// The registry uses automatic policy-based acceptance (accepted_public / rejected_by_policy).
// There is no manual approval workflow.
router.all("/admin/*", (_req, res): void => {
  res.status(410).json({
    error: "The admin review dashboard has been removed. The registry uses automatic policy-based acceptance.",
  });
});

export default router;
