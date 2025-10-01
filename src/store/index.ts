import { configureStore } from "@reduxjs/toolkit";
import promise from "redux-promise-middleware";

import { analyticsApi } from "@store/analytics/api";
import { flightsApi } from "@store/flights/api";
import { regionsApi } from "@store/regions/api";
import { reportApi } from "@store/report/api";

export const store = configureStore({
    reducer: {
        [regionsApi.reducerPath]: regionsApi.reducer,
        [analyticsApi.reducerPath]: analyticsApi.reducer,
        [flightsApi.reducerPath]: flightsApi.reducer,
        [reportApi.reducerPath]: reportApi.reducer
    },
    devTools: process.env.NODE_ENV !== "production",
    middleware: (getDefaultMiddleware) =>
        // eslint-disable-next-line unicorn/prefer-spread
        getDefaultMiddleware().concat([
            promise,
            regionsApi.middleware,
            analyticsApi.middleware,
            flightsApi.middleware,
            reportApi.middleware
        ])
});
