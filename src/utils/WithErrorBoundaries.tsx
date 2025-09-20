import { Component, ErrorInfo, JSX, PropsWithChildren } from "react";

import ErrorScreen from "./ErrorScreen";

export default class WithErrorBoundaries extends Component<PropsWithChildren<{ children: JSX.Element }>, { error: Error | undefined }> {
    constructor(props: PropsWithChildren<{ children: JSX.Element }>) {
        super(props);
        this.state = {
            error: undefined
        };
    }

    public static getDerivedStateFromError(error: Error) {
        return {
            error
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error(error);
        console.error(errorInfo);
    }

    public render() {
        if (this.state.error) {
            return <ErrorScreen error={this.state.error} />;
        }
        return this.props.children;
    }
}
