'use client';

import styles from './page.module.css';
import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    maxSteps: 20,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);
  const [thinkingTime, setThinkingTime] = useState(0);
  const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 응답 생성 시간 측정
  useEffect(() => {
    // 로딩이 시작되면 타이머 시작
    if (isLoading) {
      setThinkingTime(0);
      thinkingTimerRef.current = setInterval(() => {
        setThinkingTime(prev => prev + 1);
      }, 1000);
    } else {
      // 로딩이 끝나면 타이머 정리
      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current);
        thinkingTimerRef.current = null;
      }
    }

    return () => {
      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current);
      }
    };
  }, [isLoading]);

  // 새 메시지가 추가될 때마다 스크롤 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // 메시지가 추가되고 전송 중이 아닐 때 input에 포커스
    if (!sending && messages.length > 0 && inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages, sending]);

  // 전송 애니메이션 처리
  const handleFormSubmit = (e: React.FormEvent) => {
    setSending(true);
    handleSubmit(e);
    setTimeout(() => {
      setSending(false);
      // 전송 애니메이션이 끝나면 input에 포커스
      inputRef.current?.focus();
    }, 300);
  };

  // 텍스트가 마크다운인지 확인하는 함수
  const isMarkdown = (text: string) => {
    // 마크다운 요소를 확인할 패턴들
    const patterns = [
      /^#+\s+/m, // 헤더: # Header
      /\[.+\]\(.+\)/, // 링크: [text](url)
      /\*\*.+\*\*/, // 볼드: **text**
      /\*.+\*/, // 이탤릭: *text*
      /```[\s\S]*?```/, // 코드 블록: ```code```
      /`[^`]+`/, // 인라인 코드: `code`
      /^\s*[-*+]\s+/m, // 글머리 기호: - item
      /^\s*\d+\.\s+/m, // 번호 매긴 목록: 1. item
      /!\[.+\]\(.+\)/, // 이미지: ![alt](url)
      /^\s*>\s+/m, // 인용구: > quote
      /^\s*-{3,}\s*$/m, // 수평선: ---
      /\|\s*[-:]+\s*\|/, // 테이블: | --- |
    ];

    return patterns.some(pattern => pattern.test(text));
  };

  // 마크다운을 HTML로 변환하고 보안 처리
  const renderMarkdown = (text: string) => {
    const html = marked(text);
    const sanitizedHtml = DOMPurify.sanitize(html as string);
    return { __html: sanitizedHtml };
  };

  // 메시지 파트를 렌더링하는 함수
  const renderMessagePart = (part: any, index: number, messageId: string) => {
    switch (part.type) {
      case 'text':
        // 마크다운인지 확인하고 적절히 렌더링
        if (isMarkdown(part.text)) {
          return (
            <div
              key={`${messageId}-${index}`}
              className={styles.markdownContainer}
              dangerouslySetInnerHTML={renderMarkdown(part.text)}
            />
          );
        }
        return <div key={`${messageId}-${index}`}>{part.text}</div>;
      case 'image':
        return (
          <div key={`${messageId}-${index}`} className={styles.imageContainer}>
            <img src={part.image.url} alt={part.image.alt || 'AI가 생성한 이미지'} className={styles.messageImage} />
            {part.image.alt && <div className={styles.imageCaption}>{part.image.alt}</div>}
          </div>
        );
      case 'markdown':
        return (
          <div
            key={`${messageId}-${index}`}
            className={styles.markdownContainer}
            dangerouslySetInnerHTML={renderMarkdown(part.markdown)}
          />
        );
      default:
        return null;
    }
  };

  // 긴 생각 시간에 따른 메시지 생성
  const getThinkingMessage = () => {
    if (thinkingTime < 3) return '생각 중...';
    if (thinkingTime < 8) return '답변을 생성 중입니다...';
    if (thinkingTime < 15) return '조금만 더 기다려주세요...';
    return '복잡한 질문을 처리하고 있습니다. 잠시만 기다려주세요...';
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>
        <h1>AI 채팅</h1>
      </div>

      <div className={styles.messageContainer}>
        {messages.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>💬</div>
            <p>AI에게 질문해보세요!</p>
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.aiMessage}`}
          >
            <div className={styles.messageHeader}>{message.role === 'user' ? '사용자' : 'AI 어시스턴트'}</div>
            <div className={styles.messageContent}>
              {message.parts.map((part, i) => renderMessagePart(part, i, message.id))}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className={`${styles.message} ${styles.aiMessage} ${styles.thinkingMessage}`}>
            <div className={styles.messageHeader}>AI 어시스턴트</div>
            <div className={styles.messageContent}>
              <div className={styles.thinkingContainer}>
                <div>{getThinkingMessage()}</div>
                <div className={styles.thinkingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleFormSubmit} className={styles.inputForm}>
        <input
          ref={inputRef}
          value={input}
          placeholder="메시지를 입력하세요..."
          onChange={handleInputChange}
          className={styles.messageInput}
          disabled={sending}
        />
        <button type="submit" className={styles.sendButton} disabled={!input || sending || isLoading}>
          {sending ? '전송 중...' : '전송'}
        </button>
      </form>
    </div>
  );
}
