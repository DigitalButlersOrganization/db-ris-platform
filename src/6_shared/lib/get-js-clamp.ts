export const getJsClamp = (
	minValue: number,
	maxValue: number,
	fromWidth: number,
	toWidth: number,
) => {
	const slope = (maxValue - minValue) / (toWidth - fromWidth);
	const yIntercept = minValue - slope * fromWidth;
	const result = `clamp(${minValue / 16}rem, ${yIntercept / 16}rem + ${slope * 100}vw, ${maxValue / 16}rem)`;
	return result;
};
