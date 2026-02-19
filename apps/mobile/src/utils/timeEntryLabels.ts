export function labelType(type: string){
    switch(type){
        case "IN":
            return "ENTRADA";
        case "BREAK_START":
            return "SAÍDA ALMOÇO";
        case "BREAK_END":
            return "VOLTA ALMOÇO";
        case "OUT":
            return "SAÍDA";
        default:
            return type;
    }
}