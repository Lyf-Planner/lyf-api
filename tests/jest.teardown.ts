// jest.teardown.js

import { exit } from "process";

export default async () => {
  // Needs to be here to close the jest session properly
  // This is because the server counts as a long running function
  exit();
};
