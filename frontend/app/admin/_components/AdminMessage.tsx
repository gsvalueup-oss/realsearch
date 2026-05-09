export default function AdminMessage({ message }: { message: string }) {
  if (!message) return null

  const isSuccess = message.includes('완료') || message.includes('성공') || message.includes('저장')

  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: 8,
      marginBottom: 24,
      fontSize: 14,
      background: isSuccess ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
      color: isSuccess ? '#34d399' : '#f87171',
      border: `1px solid ${isSuccess ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
    }}>
      {message}
    </div>
  )
}
