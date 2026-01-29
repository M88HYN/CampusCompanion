import jwt from "jsonwebtoken";

const JWT_SECRET = "your-secret-key-change-this-in-production-use-strong-random-string";

// Test 1: Generate a token with the same secret
const payload = {
  userId: "test-user",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User"
};

console.log("Generating token with secret length:", JWT_SECRET.length);
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
console.log("Generated token (first 50 chars):", token.substring(0, 50));

// Test 2: Verify the token
console.log("\nVerifying token...");
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log("✅ Token verified successfully!");
  console.log("Decoded userId:", decoded.userId);
} catch (error) {
  console.error("❌ Token verification failed:", error instanceof Error ? error.message : error);
}

// Test 3: Try with wrong secret
console.log("\nTrying with wrong secret...");
const wrongSecret = "your-secret-key-change-in-production";
try {
  const decoded = jwt.verify(token, wrongSecret);
  console.log("Token verified (unexpected)");
} catch (error) {
  console.error("✅ Correctly failed with wrong secret:", error instanceof Error ? error.message : error);
}
