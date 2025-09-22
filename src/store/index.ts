import { configureStore } from "@reduxjs/toolkit";
import promise from "redux-promise-middleware";

import { analyticsApi } from "@store/analytics/api";
import { regionsApi } from "@store/regions/api";

export const store = configureStore({
    reducer: {
        [regionsApi.reducerPath]: regionsApi.reducer,
        [analyticsApi.reducerPath]: analyticsApi.reducer
    },
    devTools: process.env.NODE_ENV !== "production",
    middleware: (getDefaultMiddleware) =>
        // eslint-disable-next-line unicorn/prefer-spread
        getDefaultMiddleware().concat([promise, regionsApi.middleware, analyticsApi.middleware])
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
