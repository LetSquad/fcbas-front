import classNames from "classnames";
import { Placeholder } from "semantic-ui-react";

import styles from "./styles/FormFieldPlaceholder.module.scss";

interface FormFieldPlaceholderProps {
    className?: string;
}

export default function FormFieldPlaceholder({ className }: FormFieldPlaceholderProps) {
    return (
        <div className={classNames(styles.container, className)}>
            <Placeholder>
                <Placeholder.Line length="short" />
            </Placeholder>
            <Placeholder className={styles.inputPlaceholder}>
                <Placeholder.Image className={styles.inputPlaceholderField} />
            </Placeholder>
        </div>
    );
}
