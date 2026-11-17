const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

// ======================================
// FIREBASE INIT — single DB only
// ======================================

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            type: process.env.FIREBASE_TYPE,
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: process.env.FIREBASE_AUTH_URI,
            token_uri: process.env.FIREBASE_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
            client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

const primaryDb = admin.database();

// ======================================
// DB PATH ALIASES
// ======================================

const DB_PATHS = {
    app_settings: "app_settings/worksethics/worksethicsEnabled",
    mpesa: "mpesa/database",
    users: "users",
    userbalance: "users/balance",
    transactions: "transactions",
    appSettings: "app_settings",
    worksethics: "app_settings/worksethics",
    lipwa_accounts: "lipwa/accounts",
    workethics_users: "WorkEthics/Users",
    workethics_payments: "WorksEthics/Payments",
    email_throttle: "email_throttle/last_sent",
};

// Allowed values for the POST "mode" field
const VALID_MODES = ["set", "update", "push"];

// ======================================
// ROUTE → FIREBASE PATH BUILDER
// ======================================

function buildPath(route, param = {}) {
    switch (route) {
        case "lipanampesa":
            // section = STKInitiations | Payments | CheckOutIds
            // phone   = phone number (only for Payments)
            // id      = checkoutId
            return param.phone
                ? `WorksEthics/UpdatedPayments/${param.section}/${param.phone}/${param.id}`
                : param.mpesacode
                    ? `WorksEthics/UpdatedPayments/${param.section}/${param.mpesacode}`
                    : `WorksEthics/UpdatedPayments/${param.section}/${param.id}`;
        case "paidusers":
            // section = STKInitiations | Payments | CheckOutIds
            // phone   = phone number (only for Payments)
            // id      = checkoutId
            return  `WorksEthics/UpdatedPayments/${param.section}/${param.regno}`;
                   case "vallensiltransactions":
            return param.id? `Vallensil/Tranxlog/${param.id}`:`Vallensil/Tranxlog`;
        case "WishMartPay":
            return param.phone
                ? `WishMartPay/UpdatedPayments/${param.section}/${param.phone}/${param.id}` :
                param.MpesaReciept
                    ? `WishMartPay/UpdatedPayments/MpesaRef/${param.mpesacode}` : param.mpesacode
                        ? `WishMartPay/UpdatedPayments/${param.section}/${param.mpesacode}`
                        : `WishMartPay/UpdatedPayments/${param.section}/${param.id}`;

        case "MpesaReciept":
            return `WorksEthics/UpdatedPayments/MpesaRef/${param.mpesacode}`;
           
        case "WishKenya":
            return param.productkey ? `WishKenyaCenter/${param.wishpath}/${param.productkey}` : `WishKenyaCenter/${param.wishpath}`;

        case "kumamoto":
            return DB_PATHS.app_settings;

        case "rahakwetu":
            return param.email
                ? `${DB_PATHS.workethics_users}/${param.email}`
                : DB_PATHS.workethics_users;

        case "tropicdancer":
            if (!param.datapath) {
                throw new Error('"datapath" parameter is required for tropicdancer');
            }

            const restrictedPaths = new Set([
                "ApprovalStatus",
                "CurrentBetAmount",
                "Deposits",
                "Eastmatt",
                "EmailCenter",
                "Emailjs",
                "EmailjsUpdated",
                "FaidaFunds",
                "Jobify",
                "JobifyKenya",
                "KmattSupermarket",
                "Money",
                "NewJobifyKenya",
                "NyotaApp",
                "NyotaApp2",
                "Payments",
                "Paystackdata",
                "ReferSystem",
                "Rewards",
                "Rotito",
                "SafaricomResponse",
                "TokenMaster",
                "UniversalMpesaData",
                "ValLeyAssets",
                "ValLeyData",
                "ValLeyMarketAPK",
                "ValLeyMarketStorage",
                "ValLeyMembers",
                "WishKenyaCenter",
                "WishMartPay",
                "WorkEthics",
                "WorksEthics",
                "ajabkenya",
                "app_settings",
                "bestlady",
                "carrefour",
                "chandarana",
                "chandarana1",
                "email_throttle",
                "emailjscred",
                "freshfri",
                "kmart",
                "Lipwa",
                "magunas",
                "null",
                "null!",
                "rubis",
                "vallensiltransactions",
                "undefined"
            ]);

            const cleanPath = param.datapath.replace(/\/+$/, "");

            if (restrictedPaths.has(cleanPath)) {
                throw new Error("Writing directly to parent folders is not allowed.");
            }

            return param.datapath;

     case "jobyalpha":

            if (!param.datapath) {
                throw new Error('"datapath" parameter is required for jobyalpha');
            }

            const restrictedPath = new Set([
                "ApprovalStatus",
                "CurrentBetAmount",
                "Deposits",
                "Eastmatt",
                "EmailCenter",
                "Emailjs",
                "EmailjsUpdated",
                "FaidaFunds",
                "Jobify",
                "JobifyKenya",
                "KmattSupermarket",
                "Money",
                "NewJobifyKenya",
                "NyotaApp",
                "NyotaApp2",
                "Payments",
                "Paystackdata",
                "ReferSystem",
                "Rewards",
                "Rotito",
                "SafaricomResponse",
                "TokenMaster",
                "UniversalMpesaData",
                "ValLeyAssets",
                "ValLeyData",
                "ValLeyMarketAPK",
                "ValLeyMarketStorage",
                "ValLeyMembers",
                "WishKenyaCenter",
                "WishMartPay",
                "WorkEthics",
                "WorksEthics",
                "ajabkenya",
                "app_settings",
                "bestlady",
                "carrefour",
                "chandarana",
                "chandarana1",
                "email_throttle",
                "emailjscred",
                "freshfri",
                "kmart",
                "Lipwa",
                "magunas",
                "null",
                "null!",
                "rubis",
                "undefined"
            ]);

            const newcleanPath = !param.datapath.replace(/\/+$/, "");

            if (restrictedPath.has(newcleanPath)) {
                throw new Error("Writing directly to parent folders is not allowed.");
            }

            basePath = `${!param.datapath}`;
               return basePath;


        case "chandaranacenterinterview":
            return `chandarana/interview_dates/${param.email}`;

        case "companycenter":
            return `${param.company}/applications/${param.email}`;

        case "chandaranacenter":
            return `chandarana/applications/${param.email}`;

        case "EmailCenterBackend":
            return `EmailCenter/${param.company}/${param.email}/ApplicantDetails`;

        case "niajebro":
            return param.email
                ? `${DB_PATHS.workethics_users}/${param.email}/certificate`
                : DB_PATHS.workethics_users;

        case "niyaleo":
            return DB_PATHS.email_throttle;

        case "wantam":
            return "WorksEthics/Price";

        case "teknologia":
            return `WorksEthics/KMatt/CheckOutIds/${param.checkOutId}`;

        // ── Add new routes above this line ──────────────────────

        default:
            return "";
    }
}

// ======================================
// HELPERS
// ======================================
function resolveRef(routeName, param = {}) {
    if (typeof param !== "object" || param === null || Array.isArray(param)) {
        throw new Error('"param" must be a plain object');
    }
console.log("🔍 Resolving route:", routeName, "| Params:", param);
    const fullPath = buildPath(routeName, param);

    if (!fullPath) {
        throw new Error(`Unknown route: "${routeName}". Add a case to buildPath().`);
    }

    return {
        ref: primaryDb.ref(fullPath),
        fullPath
    };
}

// ======================================
// EXPRESS APP
// ======================================

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: "*", methods: ["GET", "POST", "DELETE"] }));

app.use((req, res, next) => {
    console.log(`📬 ${req.method} ${req.originalUrl}`);
    next();
});

// Health check
app.get("/", (_req, res) => res.send("🚀 Server running"));
app.get("/health", (_req, res) => res.send("OK"));

// ======================================
// DB ROUTES — all under /umbwa/wewe/:route
// ======================================

// ── GET /umbwa/wewe/:route?param1=val ────────────────────────
// GET requests conventionally don't have a body, so params come from the query string.
app.get("/umbwa/wewe/:route", async (req, res) => {
    console.log("📬 GET hit:", req.params.route);
    console.log("📦 Query params:", req.query.param);

    try {
       const params = req.query.param ? JSON.parse(req.query.param) : {};

const { ref, fullPath } = resolveRef(req.params.route, params);
        console.log("✅ Resolved path:", fullPath);

        const snapshot = await ref.get();
        const data = snapshot.exists() ? snapshot.val() : null;

        console.log("🎉 GET success | path:", fullPath, "| data exists:", snapshot.exists());
          console.log("Returning this data:", data, );
        return res.json({
            success: true,
            path: fullPath,
            data,
            fetchedAt: new Date().toISOString(),
        });
    } catch (err) {
        console.error("❌ GET error:", err.message);
        console.error("🔍 Stack:", err.stack);
        return res.status(err.message.startsWith("Unknown route") ? 404 : 500)
            .json({ success: false, error: err.message });
    }
});

// ── POST /umbwa/wewe/:route ───────────────────────────────────
// Body: { param: {}, data: {}, mode: "set" | "update" | "push" }
app.post("/umbwa/wewe/:route", async (req, res) => {
    console.log("📬 POST hit:", req.params.route);
    console.log("📄 Body:", req.body);

    try {
        const route = req.params.route;
        const { param = {}, data, mode = "push" } = req.body;

        console.log("📂 Route:", route);
        console.log("📌 Params:", param);
        console.log("🔧 Mode:", mode);
        console.log("📦 Data:", data);

        if (!VALID_MODES.includes(mode)) {
            return res.status(400).json({
                success: false,
                error: `Invalid "mode": "${mode}". Must be one of: ${VALID_MODES.join(", ")}`
            });
        }

        if (data == null) {
            return res.status(400).json({
                success: false,
                error: '"data" is required in request body'
            });
        }

        if ((mode === "set" || mode === "update") &&
            (typeof data !== "object" || Array.isArray(data))) {
            return res.status(400).json({
                success: false,
                error: `"data" must be a plain object for mode "${mode}"`
            });
        }

        // Resolve Firebase reference using body params
        const { ref, fullPath } = resolveRef(route, param);

        console.log("✅ Resolved path:", fullPath);

        let result;

        switch (mode) {
            case "set":
                console.log("📝 Calling ref.set()");
                await ref.set(data);
                result = {
                    method: "set",
                    path: fullPath
                };
                break;

            case "update":
                console.log("✏️ Calling ref.update()");
                await ref.update(data);
                result = {
                    method: "update",
                    path: fullPath
                };
                break;

            case "push":
            default:
                console.log("➕ Calling ref.push()");
                const newRef = ref.push();

                await newRef.set({
                    ...data,
                    createdAt: new Date().toISOString()
                });

                result = {
                    method: "push",
                    path: fullPath,
                    key: newRef.key
                };
                break;
        }

        console.log("🎉 POST success:", result);

        return res.json({
            success: true,
            status: "success",
            result
        });

    } catch (err) {
        console.error("❌ POST error:", err);
        return res.status(
            err.message.startsWith("Unknown route") ? 404 : 500
        ).json({
            success: false,
            error: err.message
        });
    }
});

// ── DELETE /umbwa/wewe/:route ─────────────────────────────────
// Body: { param: {}, key: "childKey" (optional) }
// No key → deletes the whole resolved path
app.delete("/umbwa/wewe/:route", async (req, res) => {
    console.log("📬 DELETE hit:", req.params.route);
    console.log("📄 Body:", req.body);

    try {
        const { param = {}, key } = req.body || {};

        const { ref, fullPath } = resolveRef(req.params.route, param);
        console.log("✅ Resolved path:", fullPath);

        if (key) {
            console.log("🗑️ Removing child key:", key, "at:", fullPath);
            await ref.child(key).remove();
            console.log("🎉 DELETE child success");
            return res.json({ success: true, status: "success", method: "remove-child", path: fullPath, key });
        }

        console.log("🗑️ Removing entire path:", fullPath);
        await ref.remove();
        console.log("🎉 DELETE success");
        return res.json({ success: true, status: "success", method: "remove", path: fullPath });

    } catch (err) {
        console.error("❌ DELETE error:", err.message);
        console.error("🔍 Stack:", err.stack);
        return res.status(err.message.startsWith("Unknown route") ? 404 : 500)
            .json({ success: false, error: err.message });
    }
});

// ── STREAM GET /umbwa/wewe/:route/stream?param1=val ──────────
// Server-Sent Events — real-time Firebase listener.
// Uses query parameters because the browser's EventSource API cannot send a request body.
app.get("/umbwa/wewe/:route/stream", (req, res) => {
    console.log("📬 STREAM hit:", req.params.route);
    console.log("📦 Raw query:", req.query);

    let ref, fullPath;

    try {
        // Decode the same way as the normal GET endpoint
        const params = req.query.param
            ? JSON.parse(req.query.param)
            : {};

        console.log("📦 Decoded params:", params);

        ({ ref, fullPath } = resolveRef(
            req.params.route,
            params
        ));

        console.log("✅ Resolved stream path:", fullPath);

    } catch (err) {
        console.error("❌ STREAM resolve error:", err.message);

        return res
            .status(404)
            .end(JSON.stringify({
                success: false,
                error: err.message
            }));
    }

    res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    });

    res.flushHeaders();

    // Initial SSE event
    res.write(
        `data: ${JSON.stringify({
            success: true,
            connected: true,
            path: fullPath
        })}\n\n`
    );

    console.log("📡 SSE connected to:", fullPath);

    const listener = ref.on(
        "value",
        (snap) => {

            const payload = {
                success: true,
                data: snap.val(),
                path: fullPath,
                updatedAt: new Date().toISOString()
            };

            res.write(
                `data: ${JSON.stringify(payload)}\n\n`
            );
        },
        (err) => {

            console.error(
                "❌ STREAM Firebase error:",
                err.message
            );

            res.write(
                `data: ${JSON.stringify({
                    success: false,
                    error: err.message
                })}\n\n`
            );
        }
    );

    req.on("close", () => {

        console.log(
            "🔌 STREAM client disconnected from:",
            fullPath
        );

        ref.off("value", listener);
        res.end();
    });
});
// ======================================
// START SERVER
// ======================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
