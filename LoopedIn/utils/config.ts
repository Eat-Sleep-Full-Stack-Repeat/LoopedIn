//change url for http calls as needed
import { Platform } from 'react-native';

const API_URL = (Platform.OS === 'android' ? "http://10.0.2.2:5000" : "http://localhost:5000");

export default API_URL;
