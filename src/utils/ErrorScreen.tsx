export default function ErrorScreen(props: { error: Error }) {
    return <div>{props.error.message}</div>;
}
