import { createSlice } from "@reduxjs/toolkit";

interface AppState {
  active: boolean;
  login: boolean;
}

const initialState: AppState = {
  active: true,
  login: false,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    toggleActive: (state) => {
      state.active = !state.active;
    },
    toggleLogin: (state) => {
      state.login = !state.login;
    },
    setActive: (state, action) => {
      state.active = action.payload;
    },
    setLogin: (state, action) => {
      state.login = action.payload;
    },
  },
});

export const { toggleActive, toggleLogin, setActive, setLogin } = appSlice.actions;
export default appSlice.reducer;
