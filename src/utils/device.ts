// Generate a unique device ID and store in localStorage if not present
export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem('userDevice');
  if (!id) {
    id = `${navigator.userAgent}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('userDevice', id);
  }
  return id;
}
