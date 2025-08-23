# SagDu

```yaml
users:
  - id: 1
    name: "John Doe"
    age: 30
    location: "New York"
    vegan: true
    vegetarian: true
    gluten_free: false
    lactose_free: true
    soy_free: true
    inventory:
      - id: 1
        quantity: 40
      - id: 2
        quantity: 5

ingredients:
  - id: 1
    name: oatmeal
    unit: grams
    # per unit
    calories: 0.68    
    protein: 0.024 
    carbs: 0.012   
    fat: 1.4       
    fiber: 1.7
    vegetarian: true
    vegan: true
    gluten_free: false
    lactose_free: true
    soy_free: true
  - id: 2
    name: banana
    unit: pieces
    # per unit
    calories: 89 
    protein: 1.1 
    carbs: 23    
    fat: 0.3     
    fiber: 2.6
    vegetarian: true
    vegan: true
    gluten_free: true
    lactose_free: true
    soy_free: true

meals:
  - user: 1
    date: 2024-06-01
    type: breakfast
    name: "Oatmeal with Banana"
    description: "A healthy breakfast option"
    people: 1
    ingredients:
      - id: 1
        quantity: 40
      - id: 2
        quantity: 1

menus:
  - name: "Healthy Start"
    description: "A nutritious breakfast menu"
    ingredients:
      - id: 1
        quantity: 40
      - id: 2
        quantity: 1
    cooking_time: 10
    recipe:
      - preparation_time: 5
        preparation_type: "active"
        description: "Cook oatmeal with water or milk."
```
