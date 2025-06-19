const express = require("express");
const session = require("express-session");
const path = require("path");
const ejs = require("ejs");

const app = express();
const PORT = 3000;

// Prisma client
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ View Engine Setup
app.engine("ejs", (filePath, options, callback) => {
  options.filename = filePath;
  ejs.renderFile(filePath, options, callback);
});
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ✅ Static Files Middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Session Config
app.use(session({
  secret: 'rahasia-kuat-123',
  resave: false,
  saveUninitialized: false,
}));

// ✅ Middleware Proteksi Login
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// ✅ Import Routes
const itemRoutes = require("./routes/itemRoutes");
const profileRouter = require("./routes/profile");

// ✅ Gunakan Routes
app.use("/items", itemRoutes);
app.use("/profile", profileRouter);

// ✅ Login Routes
app.get("/login", (req, res) => {
  res.render("auth/login", { error: null });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || user.password !== password) {
      return res.render("auth/login", { error: "Username atau password salah!" });
    }

    // Simpan data user ke dalam session
    req.session.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
    };

    res.redirect("/");
  } catch (error) {
    console.error("Login error:", error);
    res.render("auth/login", { error: "Terjadi kesalahan pada server." });
  }
});

// ✅ Logout Route
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// ✅ Beranda (Home)
const itemController = require("./controllers/itemController");
app.get("/", requireLogin, itemController.getItemList);

// ✅ Jalankan Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
