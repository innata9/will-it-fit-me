import { apiProfile, useStore } from '../store';
import { api } from './api';

const running = new Set<string>();

/** Runs an item check in the background and writes the result into the store. */
export async function runCheck(checkId: string) {
  if (running.has(checkId)) return;
  const state = useStore.getState();
  const check = state.checks.find((c) => c.id === checkId);
  if (!check) return;
  if (!check.url && !check.screenshot) {
    state.updateCheck(checkId, { status: 'error', error: 'The screenshot is no longer available — please add it again.' });
    return;
  }
  running.add(checkId);
  state.updateCheck(checkId, { status: 'pending', error: undefined });
  try {
    const result = await api.check({ url: check.url, screenshot: check.screenshot, profile: apiProfile(state) });
    useStore.getState().updateCheck(checkId, { status: 'done', result, screenshot: undefined });
  } catch (e) {
    useStore.getState().updateCheck(checkId, { status: 'error', error: (e as Error).message });
  } finally {
    running.delete(checkId);
  }
}
