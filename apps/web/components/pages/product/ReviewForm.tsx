"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { addProductReview } from "@/lib/productApi";
import { useUserStore } from "@/lib/store";
import { useRouter } from "next/navigation";

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { authUser, auth_token, isAuthenticated } = useUserStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !authUser) {
      toast.error("Please sign in to submit a review");
      router.push("/auth/signin");
      return;
    }

    if (!auth_token) {
      toast.error("Authentication token missing. Please sign in again.");
      router.push("/auth/signin");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);

    try {
      await addProductReview(productId, rating, comment.trim(), auth_token);
      toast.success(
        "Review submitted! It will be visible after admin approval.",
      );
      setRating(0);
      setComment("");

      // Call the callback to refresh product data
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit review";
      console.error("Review submission error:", error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/30 border border-border/50 rounded-xl mt-4">
        <Star size={40} className="text-muted-foreground/30 mb-4" />
        <h4 className="text-lg font-semibold text-foreground mb-2">
          Sign in to write a review
        </h4>
        <p className="text-sm text-muted-foreground mb-6">
          You need an account to share your experience with this product.
        </p>
        <Button
          onClick={() => router.push("/auth/signin")}
          className="bg-primary hover:bg-primary/90 shadow-md font-medium"
          size="lg"
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 mt-4 px-4">
      <div className="bg-muted/30 p-8 rounded-2xl border border-border/50 shadow-sm transition-colors hover:border-primary/20 space-y-2">
        <label className="block text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
          Your Rating
        </label>
        <div className="flex items-center gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                size={42}
                className={`${
                  star <= (hoveredRating || rating)
                    ? "fill-primary text-primary drop-shadow-sm"
                    : "text-muted-foreground/30"
                } transition-colors`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
            {rating} out of 5 stars
          </span>
        )}
      </div>

      <div className="space-y-3">
        <label
          htmlFor="comment"
          className="block text-sm font-semibold text-foreground mb-2"
        >
          Your Review Text{" "}
          <span className="text-muted-foreground font-normal">(Optional)</span>
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you like or dislike? What should other shoppers know?"
          rows={7}
          className="resize-none rounded-2xl p-5 text-base bg-background border-border/70 focus:border-primary shadow-sm hover:border-primary/40 transition-colors"
        />
      </div>

      <div className="pt-6 flex flex-col gap-4">
        <Button
          type="submit"
          disabled={isSubmitting || rating === 0}
          size="lg"
          className="w-full h-14 bg-primary hover:bg-primary/90 text-base font-bold shadow-md hover:shadow-lg transition-all rounded-xl"
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
        <p className="text-sm text-center text-muted-foreground bg-muted/50 p-3 rounded-xl border border-border/30">
          Your review will be visible after admin approval. Thank you for your
          feedback!
        </p>
      </div>
    </form>
  );
};

export default ReviewForm;
