import { JSX } from "react";

import Flex from "@commonComponents/Flex";

import styles from "./styles/LoadingErrorBlock.module.scss";

interface LoadingErrorBlockProps {
    isLoadingErrorObjectText: string;
    reload?: () => void;
    additionalContent?: JSX.Element;
}

export default function LoadingErrorBlock({ isLoadingErrorObjectText, reload, additionalContent }: LoadingErrorBlockProps) {
    return (
        <Flex alignItemsCenter justifyCenter height100 width100 className={styles.failedContainer}>
            <span>
                {`Произошла ошибка при получении ${isLoadingErrorObjectText}. `}
                {reload ? (
                    <>
                        {"Попробуйте повторить "}
                        <span aria-hidden className={styles.failedContainerLink} onClick={reload}>
                            загрузку
                        </span>
                    </>
                ) : (
                    "Попробуйте позднее"
                )}
            </span>
            {additionalContent}
        </Flex>
    );
}
