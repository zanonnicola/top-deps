import execa from 'execa';

describe('top-deps CLI', () => {
  it('should throw if no args provided', async () => {
    try {
      await execa('./dist/main.js', []);
    } catch (error) {
      expect(error.exitCode).toBe(1);
    }
  });
  it('should count correctly all the unique dependencies listed in package.json', async () => {
    const { stdout } = await execa('./dist/main.js', ['./fixtures']);
    console.log(stdout);
    expect(/\btypescript\b/.test(stdout)).toBeTruthy();
    expect(/\bchalk\b/.test(stdout)).toBeTruthy();
    expect(/\brecursive-readdir\b/.test(stdout)).toBeTruthy();
  });
  it('--limit flag should return the correct number of results', async () => {
    const { stdout } = await execa('./dist/main.js', [
      './fixtures',
      '--limit=1',
    ]);
    expect(/\btypescript\b/.test(stdout)).toBeTruthy();
    expect(/\bchalk\b/.test(stdout)).toBeFalsy();
  });
  it("should display error message if folder doesn't exist", async () => {
    const { stdout } = await execa('./dist/main.js', ['./wrong']);
    expect(/\bCan not process current input\b/.test(stdout)).toBeTruthy();
  });
});
