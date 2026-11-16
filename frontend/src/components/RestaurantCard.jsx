import { Link } from "react-router-dom";
import StarRating from "./StarRating.jsx";
import { formatRating, plural, priceLabel, tileColour } from "../lib/format.js";

export function RestaurantTile({ restaurant, large = false }) {
  if (restaurant.imageUrl) {
    return <img className={`tile${large ? " tile-large" : ""}`} src={restaurant.imageUrl} alt="" loading="lazy" />;
  }
  return (
    <div className={`tile${large ? " tile-large" : ""}`} style={{ background: tileColour(restaurant.cuisine) }} aria-hidden="true">
      <span>{restaurant.cuisine || "Restaurant"}</span>
    </div>
  );
}

export default function RestaurantCard({ restaurant }) {
  const details = [restaurant.cuisine, restaurant.neighbourhood, priceLabel(restaurant.priceLevel)].filter(Boolean);

  return (
    <Link to={`/restaurants/${restaurant.id}`} className="restaurant-card">
      <RestaurantTile restaurant={restaurant} />
      <div className="restaurant-card-body">
        <h3>{restaurant.name}</h3>
        <p className="muted small">{details.join(" · ")}</p>
        <p className="rating-line">
          <StarRating value={restaurant.avgRating} size="sm" />
          {restaurant.reviewCount > 0 ? (
            <span className="small">
              <strong>{formatRating(restaurant.avgRating)}</strong>{" "}
              <span className="muted">({plural(restaurant.reviewCount, "review")})</span>
            </span>
          ) : (
            <span className="muted small">No reviews yet</span>
          )}
        </p>
      </div>
    </Link>
  );
}
