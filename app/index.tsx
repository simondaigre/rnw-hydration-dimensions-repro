import { StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';

// Rendered on the server (no window: 0x0, light), then hydrated in the browser.
export default function Index() {
	const { width, height } = useWindowDimensions();
	const colorScheme = useColorScheme();

	return (
		<View style={styles.container}>
			<Text testID="dimensions">{`Window: ${width}x${height}`}</Text>
			<Text testID="color-scheme">{`Color scheme: ${colorScheme}`}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
});
