import { Package, Meal } from '../types';

export interface DeliveryPreview {
  scheduledDate: Date;
  meals: {
    name: string;
    id: string;
  }[];
}

export function calculateDeliveryDates(
  selectedPackage: Package,
  selectedMeals: { meal: Meal; count: number }[]
): DeliveryPreview[] {
  const deliveries: DeliveryPreview[] = [];
  const today = new Date();
  
  // Calculate total meals
  let totalMeals = 0;
  selectedMeals.forEach(({ count }) => {
    totalMeals += count;
  });
  
  // Check if it's a custom package
  const isCustomPackage = selectedPackage.id === 'custom';
  let totalDays = 1;
  let mealsPerDay = 1;
  let extraMeals = 0;
  
  // For custom packages, extract the number of days from the description
  if (isCustomPackage) {
    const packageDescription = selectedPackage.description;
    const daysMatch = packageDescription.match(/en (\d+) días/i);
    
    if (daysMatch && daysMatch[1]) {
      totalDays = parseInt(daysMatch[1], 10);
    }
    
    // Calculate meals per day and extra meals
    mealsPerDay = Math.floor(totalMeals / totalDays);
    extraMeals = totalMeals % totalDays;
  }
  
  // Create a copy of the selected meals to work with
  const mealsCopy = selectedMeals.map(item => ({
    meal: { ...item.meal },
    count: item.count
  }));
  
  // Initialize delivery date (today + 2 days for the first delivery)
  let deliveryDate = new Date(today);
  deliveryDate.setDate(deliveryDate.getDate() + 2);
  let currentDay = 0;
  let remainingMeals = totalMeals;
  
  // Create deliveries until all meals are assigned
  while (remainingMeals > 0) {
    // For custom packages, calculate how many meals to include in this delivery
    let mealsForCurrentDay;
    
    if (isCustomPackage) {
      currentDay += 1;
      
      // Calculate meals for this day (base meals per day + 1 extra if needed)
      mealsForCurrentDay = mealsPerDay;
      if (extraMeals > 0) {
        mealsForCurrentDay += 1;
        extraMeals -= 1;
      }
      
      // Ensure we don't exceed remaining meals
      mealsForCurrentDay = Math.min(mealsForCurrentDay, remainingMeals);
    } else {
      // For standard packages, use 1 meal per delivery (daily deliveries)
      mealsForCurrentDay = 1;
    }
    
    // Create the delivery
    const delivery: DeliveryPreview = {
      scheduledDate: new Date(deliveryDate),
      meals: []
    };
    
    // Add meals to this delivery
    let mealsAdded = 0;
    let mealIndex = 0;
    
    while (mealsAdded < mealsForCurrentDay && mealIndex < mealsCopy.length) {
      const mealItem = mealsCopy[mealIndex];
      
      if (mealItem.count > 0) {
        delivery.meals.push({
          id: mealItem.meal.id,
          name: mealItem.meal.name
        });
        
        // Decrement this meal's count
        mealItem.count -= 1;
        mealsAdded += 1;
        remainingMeals -= 1;
      }
      
      // If this meal has been fully processed, move to the next meal
      if (mealItem.count <= 0) {
        mealIndex += 1;
      }
      
      // If we've added all meals for this day or run out of meals, stop
      if (mealsAdded >= mealsForCurrentDay || remainingMeals <= 0) {
        break;
      }
    }
    
    deliveries.push(delivery);
    
    // Next delivery in 1 day
    deliveryDate = new Date(deliveryDate);
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    
    // If we've created all the deliveries for a custom package, exit the loop
    if (isCustomPackage && currentDay >= totalDays) {
      break;
    }
  }
  
  return deliveries;
}
