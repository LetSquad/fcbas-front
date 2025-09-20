import { Route } from "react-router";

import { WithSuspense } from "@coreUtils/WithSuspense";
import { Page as PageType } from "@models/pages/types";

export function pagesToRoutes(pages: PageType) {
    return (
        Object.values(pages)
            // eslint-disable-next-line @typescript-eslint/naming-convention
            .map(({ slug, component: Component }) => (
                <Route
                    key={slug}
                    path={slug}
                    element={
                        <WithSuspense>
                            <Component />
                        </WithSuspense>
                    }
                />
            ))
    );
}
