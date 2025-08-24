"use client"

import { useRef, useEffect } from "react"
import { motion } from "framer-motion"

export function DonationWidget() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = `
        <div style="width:240px;overflow:hidden;border-radius:4px;box-shadow:0 6px 6px 0 rgba(22,45,61,.06),0 0 18px 0 rgba(22,45,61,.12)">
          <div style="display:flex;border-radius:6px;background-color:#fff;font-family:Helvetica Neue,Helvetica,Arial">
            <div style=display:flex;width:100%;flex-direction:row;flex-wrap:wrap>
              <div style="display:flex;width:100%;height:153px;align-items:center;justify-content:center;background-position:center center;background-image:url();background-color: #EDEEF5;">
                <div style=max-width:100%;width:100%;white-space:nowrap;justify-content:center;display:flex>
                  <div style=font-size:28px;font-weight:400;line-height:58px>€</div>
                  <div style=font-size:58px;font-weight:400;line-height:58px>5 </div>
                </div>
              </div>
              <div style="display:flex;justify-content:center;flex-direction:row;flex-wrap:wrap;flex-grow:initial;text-align:center;width:100%;padding:calc(18px) calc(24px) calc(24px)">
                <div style="display:flex;flex-direction:row;width:100%: max-width: 100%;max-height:84px;justify-content:center;word-break:break-word;overflow:hidden;margin-bottom:12px">
                  <div style=font-size:21px;font-weight:700;line-height:28px>Ai Resume</div>
                </div>
                <div style="display:flex;width:100%;flex-direction:row;margin:0 calc(36px) calc(12px)">
                  <hr style=background-color:#dfe5eb;min-height:1px;width:100%;border:0>
                </div>
                <div style=display:flex;flex-direction:row;justify-content:center;width:100%;height:54px;word-break:break-word;margin-bottom:12px>
                  <span style=font-size:14px;font-weight:400;line-height:18px;text-overflow:ellipsis;overflow:hidden;max-width:100%;vertical-align:bottom>🙏 Support Our Work! If you find this tool helpful, consider making a small donation to help us improve and keep it free for everyone. Every contribution makes a difference! ❤️</span>
                </div>
                <div style=display:flex;flex-direction:row;width:100%>
                  <a href="https://www.cedzlabs.com//_paylink/AZWlkIpg" target="_blank" style="width:100%">
                    <button style="background-color:black;width:100%;justify-content:center;text-align:center;height:36px;border-radius:18px;border:0;min-width:84px;padding:0 23px;text-decoration:none;user-select:none;white-spacer:nowrap;cursor:pointer;color: white;">
                      <span style=text-overflow:ellipsis;overflow:hidden;max-width:100%;vertical-align:bottom>Pay Now</span>
                    </button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    }
  }, [])

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 30 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.8,
          ease: [0.25, 0.1, 0.25, 1.0],
        },
      }}
    >
      <motion.div
        ref={containerRef}
        className="mb-6"
        whileHover={{
          scale: 1.03,
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
          transition: { duration: 0.3 },
        }}
        animate={{
          y: [0, -5, 0],
          transition: {
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            ease: "easeInOut",
            repeatDelay: 5,
          },
        }}
      ></motion.div>
      <motion.p
        className="text-sm text-gray-500 text-center mt-4 max-w-xs"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: { delay: 0.5, duration: 0.8 },
        }}
      >
        Your donation is secure and encrypted. You can also choose other payment methods on the next screen.
      </motion.p>
    </motion.div>
  )
}