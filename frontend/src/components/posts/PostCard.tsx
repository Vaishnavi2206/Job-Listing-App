import Card, { CardBody } from "../ui/Card";
import MediaCarousel from "../shared/MediaCarousel";
import type { Post } from "../../types";
import "./PostCard.css";

type PostCardProps = {
  post: Post;
};

const formatRelativeTime = (isoDate: string) => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return date.toLocaleDateString();
};

const toPlainText = (content: string) => {
  if (!content) return "";
  return content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
};

const PostCard = ({ post }: PostCardProps) => {
  const firstName = post.User?.firstName ?? "Unknown";
  const lastName = post.User?.lastName ?? "User";
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  const headline = post.User?.username ? `@${post.User.username}` : "Member";

  return (
    <Card className="post-card">
      <CardBody className="post-card__body">
        <header className="post-card__header">
          <div className="post-card__avatar" aria-hidden="true">
            {initials || "U"}
          </div>
          <div className="post-card__meta">
            <h3 className="post-card__name">{fullName}</h3>
            <p className="post-card__headline post-card__username">{headline}</p>
            <p className="post-card__time">{formatRelativeTime(post.createdAt)}</p>
          </div>
        </header>

        <p className="post-card__content">{toPlainText(post.description)}</p>

        {post.media.length > 0 && (
          <section className="post-card__media">
            <MediaCarousel media={post.media} />
          </section>
        )}
      </CardBody>
    </Card>
  );
};

export default PostCard;
