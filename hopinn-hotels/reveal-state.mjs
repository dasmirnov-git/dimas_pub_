export function createRevealController() {
  let state = 'concealed';
  return {
    get state() { return state; },
    reveal({reducedMotion = false} = {}) {
      const changed = state !== 'revealed';
      state = 'revealed';
      return {state, changed, confetti: changed && !reducedMotion};
    },
    reset() {
      const changed = state !== 'concealed';
      state = 'concealed';
      return {state, changed, confetti: false};
    }
  };
}
