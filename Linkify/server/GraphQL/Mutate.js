import { gql, useQuery, useMutation } from "@apollo/client";

const GET_MESSAGES = gql`
  query GetMessages($senderId: String!, $receiverId: String!) {
    getMessages(senderId: $senderId, receiverId: $receiverId) {
      id
      content
      timestamp
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($senderId: String!, $receiverId: String!, $content: String!) {
    sendMessage(senderId: $senderId, receiverId: $receiverId, content: $content) {
      id
      content
    }
  }
`;

const MessagingComponent = () => {
  const { data, loading, error } = useQuery(GET_MESSAGES, {
    variables: { senderId: "user1", receiverId: "user2" },
  });

  const [sendMessage] = useMutation(SEND_MESSAGE);

  const handleSend = async (content) => {
    await sendMessage({ variables: { senderId: "user1", receiverId: "user2", content } });
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      {data.getMessages.map((msg) => (
        <p key={msg.id}>{msg.content}</p>
      ))}
      <button onClick={() => handleSend("Hello!")}>Send</button>
    </div>
  );
};
