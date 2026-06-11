export function isReadOnlyDeployment() {
  return !process.env.DATABASE_URL;
}
