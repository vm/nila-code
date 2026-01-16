export function resolveColor(colorName: string): string | undefined {
  const normalized = colorName.toLowerCase().trim();

  const colorMap: Record<string, string> = {
    red: 'red',
    green: 'green',
    blue: 'blue',
    yellow: 'yellow',
    cyan: 'cyan',
    magenta: 'magenta',
    white: 'white',
    gray: 'gray',
    grey: 'gray',
    black: 'black',
    bluebright: 'blueBright',
    redbright: 'redBright',
    greenbright: 'greenBright',
    yellowbright: 'yellowBright',
    cyanbright: 'cyanBright',
    magentabright: 'magentaBright',
    whitebright: 'whiteBright',
    graybright: 'grayBright',
  };

  return colorMap[normalized];
}

export function isValidColor(colorName: string): boolean {
  return resolveColor(colorName) !== undefined;
}

