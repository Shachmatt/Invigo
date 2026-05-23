import bcrypt from "bcrypt";

const passwordToHash = "ahoj"; // Put the plain text password you want to test with here

const hash = await bcrypt.hash(passwordToHash, 10);
console.log("\n--- COPY THE STRING BELOW INTO YOUR DATABASE 'pw' COLUMN ---");
console.log(hash);
console.log("------------------------------------------------------------\n");