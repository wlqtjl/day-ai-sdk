import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VoiceRecordService } from '../services/VoiceRecordService';

interface VoiceRecorderProps {
  visible: boolean;
  onClose: () => void;
  onAnalysisComplete: (result: any) => void;
}

export function VoiceRecorder({ visible, onClose, onAnalysisComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  const voiceRecordServiceRef = useRef<VoiceRecordService>(new VoiceRecordService());
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      // 开始录音动画
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // 开始计时
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      // 停止动画
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);

      // 停止计时
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording, pulseAnim]);

  const handleStartRecording = async () => {
    const started = await voiceRecordServiceRef.current.startRecording();
    if (started) {
      setIsRecording(true);
      setRecordingTime(0);
      setAnalysisResult(null);
    }
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    setIsAnalyzing(true);
    
    const uri = await voiceRecordServiceRef.current.stopRecording();
    if (uri) {
      const result = await voiceRecordServiceRef.current.analyzeRecording(uri);
      setAnalysisResult(result);
      onAnalysisComplete(result);
    }
    
    setIsAnalyzing(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>语音记录</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#4a9a9a" />
            </Pressable>
          </View>

          <View style={styles.recordingSection}>
            {!isRecording && !analysisResult ? (
              <>
                <Text style={styles.instruction}>点击开始按钮开始录音</Text>
                <Text style={styles.notes}>录音会在后台运行，即使关闭屏幕</Text>
              </>
            ) : null}

            {isRecording ? (
              <View style={styles.recordingStatus}>
                <Animated.View
                  style={[
                    styles.recordingIndicator,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <View style={styles.recordingDot} />
                </Animated.View>
                <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
                <Text style={styles.recordingText}>录音中...</Text>
              </View>
            ) : null}

            {isAnalyzing ? (
              <View style={styles.analyzingStatus}>
                <Text style={styles.analyzingText}>正在分析对话内容...</Text>
              </View>
            ) : null}

            {analysisResult ? (
              <View style={styles.analysisResult}>
                <Text style={styles.resultTitle}>分析结果</Text>
                <Text style={styles.resultSubtitle}>关键要点</Text>
                {analysisResult.keyPoints.map((point: string, index: number) => (
                  <Text key={index} style={styles.resultItem}>• {point}</Text>
                ))}
                <Text style={styles.resultSubtitle}>客户需求</Text>
                {analysisResult.customerNeeds.map((need: string, index: number) => (
                  <Text key={index} style={styles.resultItem}>• {need}</Text>
                ))}
                <Text style={styles.resultSubtitle}>项目详情</Text>
                {analysisResult.projectDetails.map((detail: string, index: number) => (
                  <Text key={index} style={styles.resultItem}>• {detail}</Text>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.controls}>
            {!isRecording && !analysisResult && (
              <Pressable
                style={[styles.button, styles.startButton]}
                onPress={handleStartRecording}
              >
                <Ionicons name="mic" size={24} color="white" />
                <Text style={styles.buttonText}>开始录音</Text>
              </Pressable>
            )}

            {isRecording && (
              <Pressable
                style={[styles.button, styles.stopButton]}
                onPress={handleStopRecording}
              >
                <Ionicons name="stop" size={24} color="white" />
                <Text style={styles.buttonText}>停止录音</Text>
              </Pressable>
            )}

            {analysisResult && (
              <Pressable
                style={[styles.button, styles.doneButton]}
                onPress={onClose}
              >
                <Ionicons name="checkmark" size={24} color="white" />
                <Text style={styles.buttonText}>完成</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a9a9a',
  },
  closeButton: {
    padding: 5,
  },
  recordingSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  instruction: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  notes: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  recordingStatus: {
    alignItems: 'center',
  },
  recordingIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordingDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dc2626',
  },
  recordingTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  recordingText: {
    fontSize: 16,
    color: '#666',
  },
  analyzingStatus: {
    alignItems: 'center',
    padding: 20,
  },
  analyzingText: {
    fontSize: 16,
    color: '#4a9a9a',
  },
  analysisResult: {
    width: '100%',
    maxHeight: 300,
    overflow: 'auto',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  resultSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a9a9a',
    marginTop: 15,
    marginBottom: 5,
  },
  resultItem: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    marginBottom: 3,
  },
  controls: {
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  startButton: {
    backgroundColor: '#4a9a9a',
  },
  stopButton: {
    backgroundColor: '#dc2626',
  },
  doneButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default VoiceRecorder;