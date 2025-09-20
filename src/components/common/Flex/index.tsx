import type { FlexContainerProps } from "@react-css/flex/dist/src";
import FlexContainer from "@react-css/flex/dist/src/components/FlexContainer";

interface FlexProps {
    height100?: boolean;
    width100?: boolean;
    className?: string;
}

export default function Flex({ children, height100, width100, className, ...props }: FlexProps & FlexContainerProps) {
    return (
        <FlexContainer
            {...props}
            style={{
                height: height100 ? "100%" : undefined,
                width: width100 ? "100%" : undefined
            }}
            className={className}
        >
            {children}
        </FlexContainer>
    );
}
