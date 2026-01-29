import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🧹 Resetting tuitions, payments, and scholarships...\n");

  const payments = await prisma.payment.deleteMany();
  console.log(`  ✅ Deleted ${payments.count} payments`);

  const scholarships = await prisma.scholarship.deleteMany();
  console.log(`  ✅ Deleted ${scholarships.count} scholarships`);

  const tuitions = await prisma.tuition.deleteMany();
  console.log(`  ✅ Deleted ${tuitions.count} tuitions`);

  console.log("\n✅ Reset complete! Ready for fresh testing.\n");
}

main()
  .catch((e) => {
    console.error("❌ Reset failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
