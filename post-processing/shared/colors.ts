
export interface RGB {
    r: number;
    g: number;
    b: number;
}

export namespace RGB {
    export function fromInteger(int: number): RGB {
        return <RGB>{
            r:((int & 0xFF0000) >> 16),
            g:((int & 0xFF00) >> 8),
            b:((int & 0xFF))
        };
    }
}
