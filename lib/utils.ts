import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Deep merge function to properly merge nested objects
export function deepMerge(target: any, source: any) {
  const output = { ...target }

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] })
        } else {
          output[key] = deepMerge(target[key], source[key])
        }
      } else if (Array.isArray(source[key])) {
        // Handle arrays - if the source has an array with objects that have an index property,
        // use that to update specific items in the target array
        if (source[key].length > 0 && isObject(source[key][0]) && "index" in source[key][0]) {
          // This is an array of objects with index properties
          output[key] = [...target[key]]
          source[key].forEach((item: any) => {
            if ("index" in item && typeof item.index === "number") {
              if (item.index >= 0 && item.index < output[key].length) {
                // Update existing item
                const { index, ...rest } = item
                output[key][index] = { ...output[key][index], ...rest }
              }
            }
          })
        } else {
          // Replace the entire array
          output[key] = source[key]
        }
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    })
  }

  return output
}

function isObject(item: any): boolean {
  return item && typeof item === "object" && !Array.isArray(item)
}