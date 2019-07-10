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
    expect(/\btypescript\b/.test(stdout)).toBeTruthy;
    expect(/\bchalk\b/.test(stdout)).toBeTruthy;
    expect(/\bexeca\b/.test(stdout)).toBeTruthy;
  });
  it('should order correctly based on popularity', async () => {
    const { stdout } = await execa('./dist/main.js', ['./fixtures/sub_empty']);
    expect(/\bError:\b/.test(stdout)).toBeTruthy;
  });
});
