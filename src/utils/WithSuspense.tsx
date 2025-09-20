import { JSX, PropsWithChildren, Suspense } from "react";

import { Loader } from "semantic-ui-react";

import Flex from "@commonComponents/Flex";

interface WithSuspenseProps {
    loader?: JSX.Element;
}

export function WithSuspense({ children, loader }: PropsWithChildren<WithSuspenseProps>): JSX.Element {
    return (
        <Suspense
            fallback={
                loader || (
                    <Flex alignItemsCenter justifyCenter height100 width100>
                        <Loader active inline="centered" />
                    </Flex>
                )
            }
        >
            {children}
        </Suspense>
    );
}
