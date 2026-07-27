import mongoose from "mongoose"
import { env } from "./env.js"

let memoryServer = null

export async function connectDB() {
  let uri = env.MONGODB_URI

  if (!uri) {
    // Dev fallback: in-memory replica set (transactions supported).
    // Set MONGODB_URI (e.g. Atlas) to use a real database — no code changes needed.
    const { MongoMemoryReplSet } = await import("mongodb-memory-server")
    memoryServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } })
    uri = memoryServer.getUri()
    console.log("[server] MONGODB_URI not set — using in-memory MongoDB replica set (dev only)")
  }

  await mongoose.connect(uri, { dbName: "miraki_platform" })
  console.log("[server] MongoDB connected")
}

export async function disconnectDB() {
  await mongoose.disconnect()
  if (memoryServer) await memoryServer.stop()
}
