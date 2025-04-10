import express from "express";
const router = express.Router();

router.post("/", (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  // You can handle saving to DB or emailing here
  return res
    .status(200)
    .json({ success: true, message: "Form submitted successfully" });
});

export default router;
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // You can handle saving to DB or emailing here
    // For example, using a service class
    const contactService = new ContactService();
    await contactService.saveContact(name, email, message);

    return res
      .status(200)
      .json({ success: true, message: "Form submitted successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});