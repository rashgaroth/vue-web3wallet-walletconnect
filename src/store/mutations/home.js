export default {
  setModalState(state, data) {
    state.home = {
      ...state.home,
      ...data
    }
  }
}