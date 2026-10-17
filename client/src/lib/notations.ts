export function notation_to_object(token:any) {
  return {
    kind: token.split("(")[0],
    x: parseInt(token.match(/-?\d+/)[0]),
    y: parseInt(token.match(/-?\d+/g)[1]),
    count:
      token.split(")")[1] === "n"
        ? Infinity
        : token.split(")")[1].length > 0
          ? parseInt(token.split(")")[1])
          : 1,
  };
}

export function object_to_notation(token:{modifier?:"sym",kind?:string,x?:number,y?:number,count?:number | "n"}) {
    return`${token.modifier ? token.modifier + "(" : ""}${token.kind ? token.kind : ""}${token.kind ? "(" : ""}${token.x !== undefined ? token.x : ""}${token.y !== undefined ? "," : ""}${token.y !== undefined ? token.y : ""}${token.kind ? ")" : ""}${token.count !== undefined ? token.count : ""}${token.modifier ? ")" : ""}`
}