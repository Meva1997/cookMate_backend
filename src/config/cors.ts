import { CorsOptions } from "cors";

// Dev-friendly allowlist: FRONTEND_URL is primary; include common localhost ports
const allowlist = new Set<string | undefined>([
  process.env.FRONTEND_URL,
  process.env.POST_MAN_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    // Debug in non-production to see incoming origin values
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("CORS origin:", origin);
    }

    // Allow requests with no Origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Allow if origin is in the allowlist
    if (allowlist.has(origin)) {
      return callback(null, true);
    }

    // Otherwise reject
    return callback(new Error("Not allowed by CORS"));
  },
};

export default corsOptions;
