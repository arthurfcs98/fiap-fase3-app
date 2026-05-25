// eslint-disable-next-line @typescript-eslint/no-var-requires
const Sequencer = require("@jest/test-sequencer").default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Define the order of test files
    const order = [
      "auth.e2e-spec.ts",
      "customer.e2e-spec.ts",
      "vehicle.e2e-spec.ts",
      "service.e2e-spec.ts",
      "part.e2e-spec.ts",
      "service-order.e2e-spec.ts",
      "service-order-flows.e2e-spec.ts",
      "business-rules.e2e-spec.ts",
    ];

    return tests.sort((a, b) => {
      const aName = a.path.split("/").pop();
      const bName = b.path.split("/").pop();
      const aIndex = order.indexOf(aName);
      const bIndex = order.indexOf(bName);

      // If both files are in the order array, sort by order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // If only one is in the order array, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // Otherwise, sort alphabetically
      return aName.localeCompare(bName);
    });
  }
}

module.exports = CustomSequencer;
