// ref: https://stackoverflow.com/a/45887328/17124142
declare module '*.art' {
    const content: (options: { [key: string]: any }) => string;
    export default content;
}