import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Send, Globe } from 'lucide-react-native';
import { LanguageSelector } from './LanguageSelector';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUBBLE_SIZE = 60;
const MINI_BUBBLE_SIZE = 12;
const SAFE_MARGIN = 20;
const NUM_PARTICLES = 8;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Particle {
  id: number;
  animX: Animated.Value;
  animY: Animated.Value;
  animScale: Animated.Value;
  animOpacity: Animated.Value;
  startX: number;
  startY: number;
  color: string;
}

const GROQ_API_KEY = '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';

const PARTICLE_COLORS = [
  '#8b5cf6', // violet
  '#6366f1', // indigo
  '#a78bfa', // violet clair
  '#818cf8', // indigo clair
  '#c4b5fd', // lavande
  '#4f46e5', // violet foncé
  '#7c3aed', // purple
  '#9333ea', // fuchsia
];

// Textes traduits pour l'assistant IA selon la langue
const AI_TEXTS: Record<string, {
  title: string;
  subtitle: string;
  hello: string;
  welcome: string;
  placeholder: string;
  error: string;
  systemPrompt: string;
}> = {
  fr: {
    title: 'Assistant IA',
    subtitle: 'Propulsé par Groq',
    hello: 'Bonjour !',
    welcome: 'Je suis votre assistant IA. Posez-moi des questions sur l\'heure, les alarmes, la productivité ou discutons simplement !',
    placeholder: 'Écrivez votre message...',
    error: 'Désolé, une erreur est survenue. Veuillez réessayer.',
    systemPrompt: 'Tu es un assistant IA intégré dans une application d\'horloge et d\'alarmes. Tu es amical, concis et utile. Tu peux aider avec des questions sur l\'heure, les fuseaux horaires, la gestion du temps, la productivité, ou simplement discuter. Réponds toujours en français.',
  },
  en: {
    title: 'AI Assistant',
    subtitle: 'Powered by Groq',
    hello: 'Hello!',
    welcome: 'I\'m your AI assistant. Ask me about time, alarms, productivity, or let\'s just chat!',
    placeholder: 'Write your message...',
    error: 'Sorry, an error occurred. Please try again.',
    systemPrompt: 'You are an AI assistant integrated into a clock and alarm app. You are friendly, concise and helpful. You can help with questions about time, time zones, time management, productivity, or just chat. Always respond in English.',
  },
  ar: {
    title: 'مساعد الذكاء الاصطناعي',
    subtitle: 'مدعوم من Groq',
    hello: 'مرحباً!',
    welcome: 'أنا مساعدك الذكي. اسألني عن الوقت أو المنبهات أو الإنتاجية أو دعنا نتحدث!',
    placeholder: 'اكتب رسالتك...',
    error: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
    systemPrompt: 'أنت مساعد ذكاء اصطناعي مدمج في تطبيق ساعة ومنبه. أنت ودود وموجز ومفيد. يمكنك المساعدة في الأسئلة المتعلقة بالوقت والمناطق الزمنية وإدارة الوقت والإنتاجية أو مجرد الدردشة. أجب دائمًا بالعربية.',
  },
  es: {
    title: 'Asistente IA',
    subtitle: 'Impulsado por Groq',
    hello: '¡Hola!',
    welcome: 'Soy tu asistente de IA. Pregúntame sobre la hora, alarmas, productividad o simplemente charlemos.',
    placeholder: 'Escribe tu mensaje...',
    error: 'Lo siento, ocurrió un error. Por favor, inténtalo de nuevo.',
    systemPrompt: 'Eres un asistente de IA integrado en una aplicación de reloj y alarmas. Eres amigable, conciso y útil. Puedes ayudar con preguntas sobre la hora, zonas horarias, gestión del tiempo, productividad o simplemente charlar. Responde siempre en español.',
  },
  pt: {
    title: 'Assistente IA',
    subtitle: 'Desenvolvido por Groq',
    hello: 'Olá!',
    welcome: 'Sou seu assistente de IA. Pergunte-me sobre horários, alarmes, produtividade ou vamos conversar!',
    placeholder: 'Escreva sua mensagem...',
    error: 'Desculpe, ocorreu um erro. Por favor, tente novamente.',
    systemPrompt: 'Você é um assistente de IA integrado em um aplicativo de relógio e alarmes. Você é amigável, conciso e útil. Você pode ajudar com perguntas sobre horários, fusos horários, gerenciamento de tempo, produtividade ou apenas conversar. Sempre responda em português.',
  },
  zh: {
    title: 'AI 助手',
    subtitle: '由 Groq 提供支持',
    hello: '你好！',
    welcome: '我是您的 AI 助手。问我关于时间、闹钟、生产力的问题，或者我们聊聊天！',
    placeholder: '输入您的消息...',
    error: '抱歉，发生错误。请重试。',
    systemPrompt: '你是一个集成在时钟和闹钟应用中的AI助手。你友好、简洁且乐于助人。你可以帮助回答关于时间、时区、时间管理、生产力的问题，或者只是聊天。始终用中文回答。',
  },
  ja: {
    title: 'AIアシスタント',
    subtitle: 'Groq搭載',
    hello: 'こんにちは！',
    welcome: '私はあなたのAIアシスタントです。時間、アラーム、生産性について質問するか、おしゃべりしましょう！',
    placeholder: 'メッセージを入力...',
    error: '申し訳ございません、エラーが発生しました。もう一度お試しください。',
    systemPrompt: 'あなたは時計とアラームアプリに統合されたAIアシスタントです。フレンドリーで簡潔で役立ちます。時間、タイムゾーン、時間管理、生産性についての質問に答えたり、単におしゃべりしたりできます。常に日本語で応答してください。',
  },
  hi: {
    title: 'AI सहायक',
    subtitle: 'Groq द्वारा संचालित',
    hello: 'नमस्ते!',
    welcome: 'मैं आपका AI सहायक हूं। मुझसे समय, अलार्म, उत्पादकता के बारे में पूछें या बस बातचीत करें!',
    placeholder: 'अपना संदेश लिखें...',
    error: 'क्षमा करें, एक त्रुटि हुई। कृपया पुनः प्रयास करें।',
    systemPrompt: 'आप एक घड़ी और अलार्म ऐप में एकीकृत AI सहायक हैं। आप मित्रवत, संक्षिप्त और सहायक हैं। आप समय, समय क्षेत्र, समय प्रबंधन, उत्पादकता के बारे में प्रश्नों में मदद कर सकते हैं, या बस बातचीत कर सकते हैं। हमेशा हिंदी में जवाब दें।',
  },
};

interface AIBubbleProps {
  language?: string;
}

export const AIBubble: React.FC<AIBubbleProps> = ({ language = 'fr' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isForming, setIsForming] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);

  const mainBubbleScale = useRef(new Animated.Value(0)).current;
  const mainBubbleOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const texts = AI_TEXTS[language] || AI_TEXTS.fr;

  // Générer une position aléatoire qui ne gêne pas la lecture
  const generateRandomPosition = () => {
    const safeZones = [
      { x: SCREEN_WIDTH - BUBBLE_SIZE - SAFE_MARGIN, y: 100 + Math.random() * 100 },
      { x: SCREEN_WIDTH - BUBBLE_SIZE - SAFE_MARGIN, y: SCREEN_HEIGHT - 200 - Math.random() * 100 },
      { x: SAFE_MARGIN, y: 100 + Math.random() * 100 },
      { x: SAFE_MARGIN, y: SCREEN_HEIGHT - 200 - Math.random() * 100 },
      { x: SCREEN_WIDTH - BUBBLE_SIZE - SAFE_MARGIN, y: SCREEN_HEIGHT / 2 + (Math.random() - 0.5) * 100 },
    ];
    return safeZones[Math.floor(Math.random() * safeZones.length)];
  };

  // Créer les particules avec positions de départ aléatoires
  const createParticles = (centerX: number, centerY: number): Particle[] => {
    const newParticles: Particle[] = [];

    for (let i = 0; i < NUM_PARTICLES; i++) {
      const angle = (i / NUM_PARTICLES) * Math.PI * 2;
      const distance = 80 + Math.random() * 60;
      const startX = Math.cos(angle) * distance;
      const startY = Math.sin(angle) * distance;

      newParticles.push({
        id: i,
        animX: new Animated.Value(startX),
        animY: new Animated.Value(startY),
        animScale: new Animated.Value(0.3 + Math.random() * 0.4),
        animOpacity: new Animated.Value(0),
        startX,
        startY,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      });
    }

    return newParticles;
  };

  // Animation d'apparition avec particules qui se rassemblent
  const animateParticlesIn = () => {
    const newPosition = generateRandomPosition();
    setPosition(newPosition);
    setIsVisible(true);
    setIsForming(true);

    const newParticles = createParticles(newPosition.x + BUBBLE_SIZE / 2, newPosition.y + BUBBLE_SIZE / 2);
    setParticles(newParticles);

    // Phase 1: Faire apparaître les particules avec un délai échelonné
    newParticles.forEach((particle, index) => {
      setTimeout(() => {
        Animated.timing(particle.animOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, index * 50);
    });

    // Phase 2: Faire converger les particules vers le centre
    setTimeout(() => {
      const animations = newParticles.map((particle, index) => {
        return Animated.parallel([
          Animated.timing(particle.animX, {
            toValue: 0,
            duration: 600 + index * 30,
            useNativeDriver: true,
          }),
          Animated.timing(particle.animY, {
            toValue: 0,
            duration: 600 + index * 30,
            useNativeDriver: true,
          }),
          Animated.timing(particle.animScale, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.parallel(animations).start();
    }, NUM_PARTICLES * 50 + 100);

    // Phase 3: Fusion - faire disparaître les particules et apparaître la bulle principale
    setTimeout(() => {
      // Faire disparaître les particules
      newParticles.forEach((particle, index) => {
        Animated.timing(particle.animOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });

      // Effet de glow avant l'apparition
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Faire apparaître la bulle principale avec un effet de rebond
      Animated.parallel([
        Animated.spring(mainBubbleScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(mainBubbleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsForming(false);
        startPulseAnimation();
      });
    }, NUM_PARTICLES * 50 + 800);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Déclencher l'animation à l'apparition du composant
  useEffect(() => {
    const timer = setTimeout(() => {
      animateParticlesIn();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Envoyer un message à l'API Groq
  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: texts.systemPrompt,
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage.content },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      if (data.choices && data.choices[0]) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.choices[0].message.content,
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Erreur API Groq:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: texts.error,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible && !showChat) return null;

  return (
    <>
      {/* Particules qui se rassemblent */}
      {isVisible && !showChat && isForming && particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: position.x + BUBBLE_SIZE / 2 - MINI_BUBBLE_SIZE / 2,
              top: position.y + BUBBLE_SIZE / 2 - MINI_BUBBLE_SIZE / 2,
              backgroundColor: particle.color,
              opacity: particle.animOpacity,
              transform: [
                { translateX: particle.animX },
                { translateY: particle.animY },
                { scale: particle.animScale },
              ],
            },
          ]}
        />
      ))}

      {/* Effet de glow lors de la fusion */}
      {isVisible && !showChat && (
        <Animated.View
          style={[
            styles.glowEffect,
            {
              left: position.x - 20,
              top: position.y - 20,
              opacity: glowAnim,
              transform: [{ scale: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1.5],
              })}],
            },
          ]}
        />
      )}

      {/* Bulle principale avec lettres "IA" */}
      {isVisible && !showChat && !isForming && (
        <Animated.View
          style={[
            styles.bubbleContainer,
            {
              left: position.x,
              top: position.y,
              opacity: mainBubbleOpacity,
              transform: [
                { scale: Animated.multiply(mainBubbleScale, pulseAnim) },
              ],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => setShowChat(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8b5cf6', '#6366f1', '#4f46e5']}
              style={styles.bubble}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.bubbleText}>IA</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Modal de chat */}
      <Modal
        visible={showChat}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChat(false)}
      >
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.chatContainer}>
          {/* Header */}
          <View style={styles.chatHeader}>
            <View style={styles.chatHeaderLeft}>
              <LinearGradient
                colors={['#8b5cf6', '#6366f1']}
                style={styles.chatHeaderIcon}
              >
                <Text style={styles.headerIconText}>IA</Text>
              </LinearGradient>
              <View>
                <Text style={styles.chatTitle}>{texts.title}</Text>
                <Text style={styles.chatSubtitle}>{texts.subtitle}</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setShowLanguageSelector(true)}
                style={styles.languageButton}
              >
                <Globe size={20} color="#8b5cf6" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowChat(false);
                  mainBubbleScale.setValue(0);
                  mainBubbleOpacity.setValue(0);
                  animateParticlesIn();
                }}
                style={styles.closeButton}
              >
                <X size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 && (
              <View style={styles.welcomeContainer}>
                <LinearGradient
                  colors={['#8b5cf6', '#6366f1']}
                  style={styles.welcomeIcon}
                >
                  <Text style={styles.welcomeIconText}>IA</Text>
                </LinearGradient>
                <Text style={styles.welcomeTitle}>{texts.hello}</Text>
                <Text style={styles.welcomeText}>{texts.welcome}</Text>
              </View>
            )}

            {messages.map(message => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
                ]}>
                  {message.content}
                </Text>
              </View>
            ))}

            {isLoading && (
              <View style={[styles.messageBubble, styles.assistantMessage]}>
                <ActivityIndicator size="small" color="#8b5cf6" />
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={10}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={texts.placeholder}
                placeholderTextColor="#6b7280"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                ]}
              >
                <Send size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </Modal>

      {/* Sélecteur de langue */}
      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    width: MINI_BUBBLE_SIZE,
    height: MINI_BUBBLE_SIZE,
    borderRadius: MINI_BUBBLE_SIZE / 2,
    zIndex: 999,
    elevation: 9,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  glowEffect: {
    position: 'absolute',
    width: BUBBLE_SIZE + 40,
    height: BUBBLE_SIZE + 40,
    borderRadius: (BUBBLE_SIZE + 40) / 2,
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
    zIndex: 998,
    elevation: 8,
  },
  bubbleContainer: {
    position: 'absolute',
    zIndex: 1000,
    elevation: 10,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  bubbleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  chatSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 100,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeIconText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: '#8b5cf6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#e5e7eb',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#8b5cf6',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
