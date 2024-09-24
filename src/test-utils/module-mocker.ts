import { mock } from 'bun:test';

/**
 * A helper function to mock a module and return a function to restore the original module export.
 *
 * @param modulePath module name or path to be mocked (⚠️NOTE: must be relative to this file `src/test-utils/module-mocker.ts`)
 * @param factory the function that returns the mocked export
 * @returns a function to restore the original module export
 */
export const mockModule = async (modulePath: string, factory: () => Record<string, any>) => {
  // Get the original export of the module
  const originalExport = {
    ...(await import(modulePath)),
  };

  // Get the mocked export
  const mockExport = factory();

  // Merge the original and mocked exports
  const result = {
    ...originalExport,
    ...mockExport,
  };

  // Call Bun's mock module function to set the mocked export where module is imported
  mock.module(modulePath, () => result);

  // Return a function to restore the original module export
  return () => {
    // It simply restores the original module export
    mock.module(modulePath, () => originalExport);
  };
};
